import styles from './UtilitiesPage.module.css'
import io from 'socket.io-client'
import { useRef, useEffect } from 'react'
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section } from 'datocms-react-ui';

type PropTypes = { ctx: RenderPageCtx };
type ValidParameters = { host: string, username: string, password: string };

export default function UtilitiesPage({ ctx }: PropTypes) {
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const websocketServer = parameters.host;

  useEffect(() => {
    console.log(`Connecting to ${websocketServer}...`);
    const socket = io(websocketServer, {transports: ['polling', 'websocket']});
    socket.on('connect', () => console.log('connected'));
    socket.on('log', (log : String) => { console.log(log)})
    socket.on("connect_error", (err) => console.log(err.toString()));
    socket.on("error", (err) => console.log(err));
    console.log(`done setup`);
    
  }, [])

  return (
    <Canvas ctx={ctx}>
      <main className={styles.container}>
        <Section title="Utilities">
        <p>
          <Button>Import pricelist (.xlsx)</Button>
        </p>
        </Section>
      </main>
    </Canvas>
  );
}