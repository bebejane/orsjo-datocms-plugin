import styles from './UtilitiesPage.module.css'
import {io, Socket} from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section, TextField } from 'datocms-react-ui';
import { format } from 'date-fns';
import { encode } from 'base64-ts';
import { GrDocumentPdf } from 'react-icons/gr'

type PropTypes = { ctx: RenderPageCtx };
type ValidParameters = { host: string, username: string, password: string };
type Log = {t:string, m:string};
type Status = {id:number, status:string, type:string, data?:any, item?:number, total?:number, updated?:number, notFound?:number};
type StatusMap = {locale:string, id?:number, status?:Status, processing?:boolean};
type Upload = {url:string, filename:string};

const locales : StatusMap[] = [{locale:'en'}, {locale:'sv'}, {locale:'no'}]

export default function UtilitiesPage({ ctx }: PropTypes) {
  const [logs, setLogs] = useState<Log[]>([])
  const [status, setStatus] = useState<StatusMap[]>(locales)
  const [importStatus, setImportStatus] = useState<Status>()
  const [selectedFile, setSelectedFile] = useState<File>()

  const [connectionError, setConnectionError] = useState<Error>()
  const [isConnected, setIsConnected] = useState<Boolean>(false);

  const socketRef = useRef<Socket>();
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const websocketServer = parameters.host;
  const username = parameters.username;
  const password = parameters.password;

  const callApi = async (path:string, locale:string) => {
    
    const headers = new Headers(); 
		const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(username + ":" + password)))}`
    headers.append('Authorization', basicAuth);    
    
    setStatus(status.map(s => ({...s, processing: s.locale === locale ? true : s.processing})));
    
    const res = await fetch(`${websocketServer}${path}`, {method: 'GET', headers})
    const { id } = await res.json()
    setStatus(status.map(s => ({...s, id: s.locale === locale ? parseInt(id) : s.id, processing: s.locale === locale ? true : s.processing})));
    
  }

  const fileChangeHandler = (event:any) => setSelectedFile(event.target.files[0]);

	const handleImportPricelist = async (e:any) => {
    if(!selectedFile) return 
		const formData = new FormData();
    formData.append('file', selectedFile);
		const headers = new Headers(); 
		const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(username + ":" + password)))}`
    headers.append('Authorization', basicAuth);    
		const res = await fetch(`${websocketServer}/import`,{method: 'POST', body: formData, headers})
		const { id } = await res.json()
    setImportStatus({id, type:'import', status:'STARTING'})
	};

  useEffect(() => {
    console.log(`Connecting to ${websocketServer}...`);
    
    socketRef.current = io(websocketServer, {transports: ['polling', 'websocket'], });
    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('log', (log : Log) => { 
      logs.push(log);
      setLogs([...logs]);
    })
    socketRef.current.on('status', (stat : Status) => { 
      if(stat.type === 'import') {
        console.log(stat);
        setImportStatus(stat);
      }else
        setStatus((status) => status.map(s => ({...s, status: s.id === stat.id ? stat : s.status})));
    })
    socketRef.current.on("connect_error", (err) => setConnectionError(err));
    socketRef.current.on("error", (err) => setConnectionError(err));

    console.log(`done ws setup`);

    return () => { socketRef?.current?.disconnect() };

  }, [websocketServer])

  const downloadFile = (s?:Status) => {
    if(!s || !s.data?.uploads) return 
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = s?.data?.uploads[0].url;
    document.body.appendChild(link);
    link.click();
    ctx.notice(`Downloading "${s?.data?.uploads[0].filename}"`);
    setTimeout(() => { link.parentNode?.removeChild(link)}, 0);
  }

  return (
    <Canvas ctx={ctx}>
      <main className={styles.container}>

        <Section title="Import excel price list">
        <p>
          <input className={styles.file} onChange={fileChangeHandler} type="file" name="pricelist" id="pricelist" accept=".xlsx, application/vnd.ms-excel"/>
          <Button onClick={handleImportPricelist} disabled={selectedFile === undefined}>Start</Button>
          <br/>
          <progress
            className={styles.progress}
            max={importStatus?.data?.total || 0} 
            value={importStatus?.data?.item || 0}
          /> {importStatus?.data?.total && `${importStatus?.data?.item}/${importStatus?.data?.total}`}
        </p>
        </Section>

        <Section title="Generate price list PDF">
          {status.map(({locale, status, id, processing}) =>
            <p>
              <Button onClick={()=>callApi(`/${locale}/catalogue`, locale)} >
                {`Generate Pricelist (${locale})`} 
              </Button>
              &nbsp;
              <Button 
                disabled={status?.status !== 'END'} 
                onClick={()=>downloadFile(status)} 
                leftIcon={!processing || status?.status === 'END' ? <GrDocumentPdf/> : <Spinner/>}
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