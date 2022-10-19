import type { Status, ValidParameters } from '../types'
import styles from './UtilitiesSidebar.module.css'
import { io, Socket } from 'socket.io-client'
import { RenderItemFormSidebarPanelCtx } from 'datocms-plugin-sdk';
import { Canvas, Spinner, Button } from 'datocms-react-ui';
import { useEffect, useRef, useState } from 'react';

type PropTypes = { ctx: RenderItemFormSidebarPanelCtx };

export default function UtilitiesSidebar({ ctx }: PropTypes) {

  const productId = ctx.item?.id;
  const locale = ctx.locale;
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const [isConnected, setIsConnected] = useState(false)
  const [requestId, setRequestId] = useState<number>()
  const [isRequesting, setIsRequesting] = useState<boolean>(false)
  const [status, setStatus] = useState<Status>()
  const [connectionError, setConnectionError] = useState<string>()
  const socketRef =  useRef<Socket | null>(null)

  const generate = () => {
    setConnectionError(undefined)
    setIsRequesting(true)
    socketRef?.current?.send('product', {productId, locale}, ({id}: {id:number})=> {
      setRequestId(id)
    })
  }
  
  useEffect(() => {
    console.log(`Connecting to ${parameters.host}...`);
    
    socketRef.current = io(parameters.host, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: 99999
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('status', (stat : Status) => { 
      if(stat.type === 'ERROR')
        ctx.notice(`Error: ${stat.error || JSON.stringify(stat.error)}`)  
      else if(stat.type === 'END'){
        ctx.notice(`PDF re-generated!`)
        setIsRequesting(false)
      }
      setStatus(stat);
    })
    socketRef.current.on("connect_error", (err) => setConnectionError(err.message));
    socketRef.current.on("error", (err) => {
      setConnectionError(err)
      setIsRequesting(false)
    });
    console.log(`done ws setup`);

    return () => { 
      socketRef.current?.removeAllListeners(); 
      socketRef?.current?.disconnect() 
    };

  }, [parameters.host, ctx])

  if(!isConnected) 
    return <Canvas ctx={ctx}><Spinner /></Canvas>;

  const isGenerating = status?.id && requestId === status.id && status?.type !== 'END'
  const error = status?.type === 'ERROR' ? status.error : connectionError;
  
  return (
    <Canvas ctx={ctx}>
      <Button onClick={generate} buttonSize="xxs" fullWidth>
        {!isGenerating && !isRequesting ? `Re-generate PDF (${locale})` : <Spinner /> }
      </Button>
      {error && <div className={styles.error}>{error.message || error}</div>}
    </Canvas>
  );
}