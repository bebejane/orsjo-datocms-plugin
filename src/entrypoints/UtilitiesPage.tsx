import styles from './UtilitiesPage.module.css'
import {io, Socket} from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section } from 'datocms-react-ui';
import { format } from 'date-fns';
import { encode } from 'base64-ts';
import { GrDocumentPdf } from 'react-icons/gr'

type PropTypes = { ctx: RenderPageCtx };
type ValidParameters = { host: string, username: string, password: string };
type Log = {t:string, m:string};
type Status = {id:number, status:string, type:string, data?:any};
type StatusMap = {locale:string, id?:number, status?:Status, processing?:boolean};
type Upload = {url:string, filename:string};

const locales : StatusMap[] = [{locale:'en'}, {locale:'sv'}, {locale:'no'}]

export default function UtilitiesPage({ ctx }: PropTypes) {
  const [logs, setLogs] = useState<Log[]>([])
  const [status, setStatus] = useState<StatusMap[]>(locales)

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

    const res = await fetch(`${websocketServer}${path}`, {method: 'GET',headers})
    const { id } = await res.json()
    
    setStatus(status.map(s => ({...s, id: s.locale === locale ? parseInt(id) : s.id, processing: s.locale === locale ? true : s.processing})));
  }

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
      console.log(stat);
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
        <Section title="Utilities">
        <p>
          <Button>Import pricelist (.xlsx)</Button>
        </p>
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
        <Section title="Server logs">
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