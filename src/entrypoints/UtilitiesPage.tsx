import styles from './UtilitiesPage.module.css'
import GeneratePdfButton from '../components/GeneratePdfButton'
import { io, Socket } from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section, TextField } from 'datocms-react-ui';
import { format } from 'date-fns';

type PropTypes = { ctx: RenderPageCtx };
type ValidParameters = { host: string, username: string, password: string };
type Log = {t:string, m:string};
type Status = {id:number, status:string, type:string, path:string, locale:string, data?:any, item?:number, total?:number, updated?:[], notFound?:[]};
type StatusMap = {locale:string, path:string, label:string, id?:number, status?:Status, processing?:boolean};

const catalogues : StatusMap[] = [
  {locale:'en', path:'/en/catalogue', label:'Full - EN'}, 
  {locale:'sv', path:'/sv/catalogue', label:'Full - SV'}, 
  {locale:'no', path:'/no/catalogue', label:'Full - NO'}, 
  {locale:'en', path:'/en/catalogue/light', label:'Light - EN'}, 
  {locale:'sv', path:'/sv/catalogue/light', label:'Light - SV'}, 
  {locale:'no', path:'/no/catalogue/light', label:'Light - NO'}, 
  {locale:'sv', path:'/sv/catalogue/with-lightsource', label:'Inc. Light - SV'}
]

export default function UtilitiesPage({ ctx } : PropTypes) {

  const [logs, setLogs] = useState<Log[]>([])
  const [status, setStatus] = useState<StatusMap[]>(catalogues)
  const [importStatus, setImportStatus] = useState<Status>()
  const [selectedFile, setSelectedFile] = useState<File>()

  const [connectionError, setConnectionError] = useState<Error>()
  const [isConnected, setIsConnected] = useState<Boolean>(false);

  const socketRef = useRef<Socket>();
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const websocketServer = parameters.host;
  const username = parameters.username;
  const password = parameters.password;

  const requestGeneration = async (path:string, locale:string) => { 
    const headers = new Headers(); 
		const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(username + ":" + password)))}`
    headers.append('Authorization', basicAuth);    
    const res = await fetch(`${websocketServer}${path}`, {method: 'GET', headers})
    const { id } = await res.json()
    const newStatus = status.map(s => ({...s, id: s.path === path ? parseInt(id) : s.id, status: s.path === path ? undefined : s.status}));
    setStatus([...newStatus]);
  }

  const fileChangeHandler = (event:any) => setSelectedFile(event.target.files[0]);

	const handleImportPricelist = async (e:any) => {
    if(!selectedFile) return 
		const formData = new FormData();
    formData.append('file', selectedFile);
    const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(username + ":" + password)))}`
		const headers = new Headers(); 
		headers.set('Authorization', basicAuth);    
    
    const res = await fetch(`${websocketServer}/import`,{method: 'POST', body: formData, headers})
		const { id } = await res.json()
    setImportStatus({id, type:'import', status:'STARTING', path:'/import', locale:'en'})
	};

  useEffect(() => {
    console.log(`Connecting to ${websocketServer}...`);
    
    socketRef.current = io(websocketServer, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: 99999
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('log', (log : Log) => { 
      logs.push(log);
      setLogs([...logs]);
    })
    socketRef.current.on('status', (stat : Status) => { 
      if(stat.status === 'ERROR'){
        console.error(stat.data)
        ctx.notice(`Error: ${stat.data?.message || JSON.stringify(stat.data)}`)
      }
        
      if(stat.type === 'import')
        setImportStatus(stat);
      else
        setStatus((status) => status.map(s => ({...s, status: s.id === stat.id ? stat : s.status})));
    })
    socketRef.current.on("connect_error", (err) => setConnectionError(err));
    socketRef.current.on("error", (err) => setConnectionError(err));
    console.log(`done ws setup`);

    return () => { socketRef?.current?.disconnect() };

  }, [websocketServer])

  if(!isConnected) 
    return <Canvas ctx={ctx}><main className={styles.container}>Connecting to server... <Spinner/></main></Canvas>
  
  return (
    <Canvas ctx={ctx}>
      <main className={styles.container}>

        <Section title="Import new prices (.xlxs)">
        <p>
          <input className={styles.file} onChange={fileChangeHandler} type="file" name="pricelist" id="pricelist" accept=".xlsx, application/vnd.ms-excel"/>
          <Button onClick={handleImportPricelist} disabled={selectedFile === undefined}>Start</Button>
          <br/>
          <progress
            className={styles.progress}
            max={importStatus?.data?.total || 0} 
            value={importStatus?.data?.item || 0}
          /> 
          {importStatus?.data?.total && `${importStatus?.data?.item} / ${importStatus?.data?.total} products`}
          {importStatus && importStatus.status !== "END" && <Spinner/>}
          
          {importStatus?.data?.notFound?.length > 0 &&
            <table className={styles.notFound}>
              <tr><th colSpan={4}>Not found</th></tr>
              {importStatus?.data?.notFound.map((p:any) => 
                <tr>
                  <td>{p.articleNo}</td>
                  <td>{p.description}</td>
                  <td>{p.price}</td>
                  <td>{p.type}</td>
                </tr>
              )}
            </table>
          }
          {importStatus?.data?.errors?.length > 0 &&
            <table className={styles.notFound}>
              <tr><th colSpan={4}>Errors</th></tr>
              {importStatus?.data?.errors.map((p:any) => 
                <tr>
                  <td>{p?.product.articleNo}</td>
                  <td>{p?.product.description}</td>
                  <td>{p?.product.price}</td>
                  <td>{p?.error?.message}</td>
                </tr>
              )}
            </table>
          }
        </p>
        </Section>

        <Section title="Generate catalogue">
          {status.map(({label, locale, status, path }) =>
            <p>
              <GeneratePdfButton 
                ctx={ctx} 
                status={status} 
                label={label} 
                locale={locale} 
                path={path} 
                requestGeneration={requestGeneration}
              />
            </p>
          )}
        </Section>

        <Section title="Logs">
          <textarea 
            id="logs" 
            className={styles.logs} 
            value={logs.map((log) => `[${format(new Date(log.t), 'yyyy-MM-dd HH:mm:ss')}] ${log.m}`).join('')}
          />
          <Button onClick={()=>setLogs([])}>Clear</Button>
        </Section>

      </main>
    </Canvas>
  );
}