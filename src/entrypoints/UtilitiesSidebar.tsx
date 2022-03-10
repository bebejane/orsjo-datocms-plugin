import styles from './UtilitiesSidebar.module.css'
import {io} from 'socket.io-client'
import { RenderItemFormSidebarPanelCtx } from 'datocms-plugin-sdk';
import { Canvas, Spinner} from 'datocms-react-ui';
import { useEffect, useState} from 'react';

type Status = {id:number, status:string, type:string, path:string, locale:string, data?:any, item?:number, total?:number, updated?:[], notFound?:[]};
type PropTypes = { ctx: RenderItemFormSidebarPanelCtx };
type ValidParameters = { host: string, username: string, password: string };

export default function UtilitiesSidebar({ ctx } : PropTypes) {
  const productId = ctx.item?.id;
  const parameters = ctx.plugin.attributes.parameters as ValidParameters;
  const [isConnected, setIsConnected] = useState(false)
  const [requestId, setRequestId] = useState<number>()
  const [status, setStatus] = useState<Status>()
  const [connectionError, setConnectionError] = useState<string>()
  
  const generate = async () => {
    setConnectionError(undefined)
    try{
      const res = await fetch(`${parameters.host}/product/${productId}`, {method:'GET'})
      const {id} = await res.json();
      setRequestId(id);
      
    }catch(err:any){
      setConnectionError(err?.message)
    }
    
  }
  useEffect(() => {
    const socket = io(parameters.host, {transports: ['polling', 'websocket'],reconnection: true,reconnectionDelay: 1000,reconnectionDelayMax : 5000,reconnectionAttempts: 99999});
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('status', (stat : Status) => setStatus(stat))
    socket.on("connect_error", (err:Error) => setConnectionError(err?.message));
    socket.on("error", (err:Error) => setConnectionError(err?.message));
    return () => { socket.disconnect() };

  }, [parameters.host])

  if(!isConnected) return <Canvas ctx={ctx}><Spinner/></Canvas>;
  const isGenerating = status?.id && requestId === status.id && status?.status !== 'END'
  const error = status?.status === 'ERROR' ? status.data?.message : connectionError;

  return (
    <Canvas ctx={ctx}>
      <a className={styles.link} href={'#'} onClick={generate}>
        Re-generate PDF {isGenerating && <Spinner/>}
      </a>
      {error && <div className={styles.error}>{error}</div>}
    </Canvas>
  );
}