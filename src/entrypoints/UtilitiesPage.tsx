import styles from './UtilitiesPage.module.css'
import io from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section } from 'datocms-react-ui';
import { format } from 'date-fns';
import GeneratePdfButton from '../components/GeneratePdfButton';

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
		const basicAuth = `Basic ${btoa(username + ":" + password)}`
    headers.append('Authorization', basicAuth);
    const res = await fetch(`${websocketServer}${path}`, {
			method: 'GET',
			headers
		})
		const data = await res.json();
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
    socket.on('status', (s : Status) => { 
      //status[s.id] = s;
      //setStatus({...s})
    })
    socket.on("connect_error", (err) => setConnectionError(err));
    socket.on("error", (err) => setConnectionError(err));

    console.log(`done ws setup`);

  }, [websocketServer])
  
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
            {status && status.status !== 'END' && <Spinner/>}
            {status && status.status === 'END' && status.data?.uploads.map((u:Upload) =>
              <a href={u.url} target="_new">{u.filename}</a>
            )}
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