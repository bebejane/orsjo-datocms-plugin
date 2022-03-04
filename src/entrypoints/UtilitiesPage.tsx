import styles from './UtilitiesPage.module.css'
import io from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section } from 'datocms-react-ui';
import {format} from 'date-fns';

type PropTypes = { ctx: RenderPageCtx };
type ValidParameters = { host: string, username: string, password: string };
type Log = {t:string, m:string};

export default function UtilitiesPage({ ctx }: PropTypes) {
  const [logs, setLogs] = useState<Log[]>([])
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const websocketServer = parameters.host;
  const username = parameters.username;
  const password = parameters.password;

  useEffect(() => {
    console.log(`Connecting to ${websocketServer}...`);
    //const headers = new Headers(); 
		//const basicAuth = `Basic ${btoa(username + ":" + password)}`
    //headers.append('Authorization', basicAuth);
		
    const socket = io(websocketServer, {transports: ['polling', 'websocket'], });
    socket.on('connect', () => console.log('connected ws'));
    socket.on('log', (log : Log) => { 
      logs.push(log);
      setLogs([...logs]);
      //logger.value = logs.map((log) => '[' + formatDate(log.t) + '] ' + log.m).join('')
      //logger.scrollTop = logger.scrollHeight;
    })
    socket.on("connect_error", (err) => console.log(err.toString()));
    socket.on("error", (err) => console.log(err));
    console.log(`done ws setup`);

  }, [websocketServer])
  
  console.log(logs)

  return (
    <Canvas ctx={ctx}>
      <main className={styles.container}>
        <Section title="Utilities">
        <p>
          <Button>Import pricelist (.xlsx)</Button>
        </p>
        <p>Logs</p>
        <textarea id="logs">
          {logs.map((log) => `${format(new Date(log.t), 'yyyy-MM-dd HH:mm:ss')} ${log.t}`).join('\n')}
        </textarea>
        </Section>

      </main>
    </Canvas>
  );
}