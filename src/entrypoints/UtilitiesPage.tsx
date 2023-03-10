import styles from './UtilitiesPage.module.css'
import type { Status, ValidParameters } from '../types'
import GeneratePdfButton from '../components/GeneratePdfButton'
import { io, Socket } from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section } from 'datocms-react-ui';
import { format } from 'date-fns';

type PropTypes = { ctx: RenderPageCtx };
type Log = { t: string, m: string };
type StatusMap = { locale: string, path: string, label: string, id?: number, status?: Status, processing?: boolean };

const catalogues: StatusMap[] = [
  { locale: 'en', path: '/en/catalogue', label: 'Full (en)' },
  { locale: 'sv', path: '/sv/catalogue', label: 'Full (sv)' },
  { locale: 'no', path: '/no/catalogue', label: 'Full (no)' },
  { locale: 'en', path: '/en/catalogue/light', label: 'Light (en)' },
  { locale: 'sv', path: '/sv/catalogue/light', label: 'Light (sv)' },
  { locale: 'no', path: '/no/catalogue/light', label: 'Light (no)' },
  { locale: 'sv', path: '/sv/catalogue/with-lightsource', label: 'Inc. Light (sv)' }
]

export default function UtilitiesPage({ ctx }: PropTypes) {

  const logsRef = useRef<Log[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [status, setStatus] = useState<StatusMap[]>(catalogues)
  const [importStatus, setImportStatus] = useState<Status>()
  const [importId, setImportId] = useState<number>()
  const [selectedFile, setSelectedFile] = useState<File>()

  const [connectionError, setConnectionError] = useState<Error>()
  const [isConnected, setIsConnected] = useState<Boolean>(false);
  const [showLogs, setShowLogs] = useState<Boolean>(false);

  const socketRef = useRef<Socket>();
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const websocketServer = parameters.host;
  const username = parameters.username;
  const password = parameters.password;

  const requestGeneration = async (path: string, locale: string) => {
    socketRef?.current?.send('catalogue', { path, locale }, ({ id }: { id: number }) => {
      const newStatus = status.map(s => ({ ...s, id: s.path === path ? id : s.id, status: s.path === path ? undefined : s.status }));
      setStatus(newStatus)
    })
  }
  const handleImportPricelist = async (e: any) => {
    if (!selectedFile) return console.log('no selected file')
    const excelFileBase64 = await convertBase64(selectedFile);
    socketRef?.current?.send('pricelist', { excelFileBase64 }, ({ id }: { id: number }) => {
      setImportId(id)
    })
  };

  const fileChangeHandler = (event: any) => setSelectedFile(event.target.files[0]);

  const convertBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const resetLogs = () => { if (typeof logsRef !== 'undefined') logsRef.current = []; updateLogs() }
  const addLogs = (log: Log) => { if (typeof logsRef !== 'undefined') logsRef.current.push(log); updateLogs() }
  const updateLogs = () => setLogs(logsRef.current)

  useEffect(() => {
    console.log(`Connecting to ${websocketServer}...`);
    if (isConnected) return

    socketRef.current = io(websocketServer, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 10000,
      reconnectionDelayMax: 60000,
      reconnectionAttempts: 99999
    });

    socketRef.current.on('connect', () => {
      console.log(`connected`);
      setIsConnected(true)
    });
    socketRef.current.on('disconnect', () => {
      console.log(`disconnected`);
      setIsConnected(false)
    });
    socketRef.current.on('log', (log: Log) => addLogs(log))
    socketRef.current.on('status', (stat: Status) => {

      if (stat.type === 'ERROR')
        ctx.notice(`Error: ${stat.error || JSON.stringify(stat.error)}`)

      if (stat.command === 'pricelist')
        setImportStatus(stat);
      else
        setStatus((status) => status.map(s => ({ ...s, status: s.id === stat.id ? stat : s.status })));
    })

    socketRef.current.on("connect_error", (err) => setConnectionError(err));
    socketRef.current.on("error", (err) => setConnectionError(err));

    return () => {
      socketRef.current?.removeAllListeners();
      socketRef?.current?.disconnect()
    };

  }, [websocketServer])

  if (!isConnected)
    return <Canvas ctx={ctx}><main className={styles.container}>Connecting to server... <Spinner /></main></Canvas>

  const isImporting = importStatus && importStatus.type !== "END" && importStatus.type !== "ERROR";

  return (
    <Canvas ctx={ctx}>
      <main className={styles.container}>
        <Section title="Import new prices (.xlsx)">
          <p>
            <input
              className={styles.file}
              onChange={fileChangeHandler}
              type="file"
              name="pricelist"
              id="pricelist"
              accept=".xlsx, application/vnd.ms-excel"
            />
          </p>
          <p>
            <progress
              className={styles.progress}
              max={importStatus?.total || 0}
              value={importStatus?.item || 0}
            />
            <br />

            {importStatus?.total && `${importStatus?.item} / ${importStatus?.total} products`} {importStatus?.article && `(${importStatus?.article} / ${importStatus?.totalArticles})`}
          </p>
          <p>
            <Button
              onClick={handleImportPricelist}
              disabled={selectedFile === undefined || isImporting}
              buttonSize="xxs"
            >
              Start
            </Button>
          </p>
          <p>
            {importStatus && importStatus.notFound && importStatus.notFound.length > 0 &&
              <table className={styles.notFound}>
                <tr><th colSpan={4}>Not found</th></tr>
                {importStatus?.notFound?.map((p: any, idx) =>
                  <tr key={idx}>
                    <td>{p.articleNo}</td>
                    <td>{p.description}</td>
                    <td>{p.price}</td>
                    <td>{p.type}</td>
                  </tr>
                )}
              </table>
            }
            {importStatus && importStatus.errors && importStatus.errors.length > 0 &&
              <table className={styles.notFound}>
                <tr><th colSpan={4}>Errors</th></tr>
                {importStatus?.errors?.map((p: any, idx) =>
                  <tr key={idx}>
                    <td>Dato Id: {p?.product?.id}</td>
                    <td>{p?.product?.title}</td>
                    <td></td>
                    <td>{p?.error?.message}</td>
                  </tr>
                )}
              </table>
            }
          </p>
        </Section>

        <Section title="Generate catalogue">
          {status.map(({ label, locale, status, path }, idx) =>
            <>
              <GeneratePdfButton
                //key={idx}
                ctx={ctx}
                status={status}
                label={label}
                locale={locale}
                path={path}
                requestGeneration={requestGeneration}
              />
              {idx % 3 === 2 && <br />}
            </>
          )}
        </Section>


        <Button buttonSize="xxs" onClick={() => setShowLogs(!showLogs)} className={styles.toggleLogs}>
          {showLogs ? 'Hide logs' : 'Show logs'}
        </Button>


        {showLogs &&
          <Section title="Logs" headerClassName={styles.logsHeader}>
            <textarea
              id="logs"
              className={styles.logs}
              value={logs.map((log) => `[${format(new Date(log.t), 'yyyy-MM-dd HH:mm:ss')}] ${log.m}`).join('')}
            />
            <Button buttonSize="xxs" onClick={resetLogs}>Clear</Button>
          </Section>
        }


      </main>
    </Canvas>
  );
}