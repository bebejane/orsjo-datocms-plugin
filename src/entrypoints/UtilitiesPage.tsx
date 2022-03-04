import styles from './UtilitiesPage.module.css'
import io from 'socket.io-client'
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
type StatusMap = {locale:string, id?:number, status?:Status};
type Upload = {url:string, filename:string};

const locales : StatusMap[] = [{locale:'en'}, {locale:'sv'}, {locale:'no'}]

export default function UtilitiesPage({ ctx }: PropTypes) {
  const [logs, setLogs] = useState<Log[]>([])
  const [status, setStatus] = useState<StatusMap[]>(locales)

  const [connectionError, setConnectionError] = useState<Error>()
  const [isConnected, setIsConnected] = useState<Boolean>(false);

  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const websocketServer = parameters.host;
  const username = parameters.username;
  const password = parameters.password;

  const callApi = async (path:string, locale:string) => {
    console.log(document.referrer);
    const headers = new Headers(); 
    
		const basicAuth = `Basic ${btoa(unescape(encodeURIComponent(username + ":" + password)))}`
    headers.append('Authorization', basicAuth);
    const res = await fetch(`${websocketServer}${path}`, {
			method: 'GET',
			headers
		})
		const data = await res.json();
    console.log(data, locale)
    setStatus(status.map(s => ({...s, id:s.locale === locale ? data.id : s.id})));
  }

  useEffect(() => {
    console.log(`Connecting to ${websocketServer}...`);
    
    const socket = io(websocketServer, {transports: ['polling', 'websocket'], });
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('log', (log : Log) => { 
      logs.push(log);
      setLogs([...logs]);
    })
    socket.on('status', (stat : Status) => { 
      console.log(stat);
      setStatus((status) => status.map(s => ({...s, status: s.id === stat.id ? stat : s.status})));
    })
    socket.on("connect_error", (err) => setConnectionError(err));
    socket.on("error", (err) => setConnectionError(err));

    console.log(`done ws setup`);

    return () => { socket.disconnect() };

  }, [websocketServer])

  const downloadFile = (s?:Status) => {
    if(!s || !s.data?.uploads) return 
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = s?.data?.uploads[0].url;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { link.parentNode?.removeChild(link)}, 0);
  }

  console.log(status)

  return (
    <Canvas ctx={ctx}>
      <main className={styles.container}>
        <Section title="Utilities">
        <p>
          <Button>Import pricelist (.xlsx)</Button>
        </p>
        {status.map(({locale, status}) =>
          <p>
            <Button onClick={()=>callApi(`/${locale}/catalogue`, locale)}>
              {`Generate Pricelist (${locale})`} 
            </Button>
            <Button disabled={status?.status !== 'END'} onClick={()=>downloadFile(status)}>
              {!status || status?.status === 'END' ? <GrDocumentPdf/> : <Spinner/>}
            </Button>
          </p>
        )}
        <p>Server logs</p>
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