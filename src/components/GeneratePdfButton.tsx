import styles from './GeneratePdfButton.module.css'
import io from 'socket.io-client'
import { useRef, useEffect, useState } from 'react'
import { Button, Spinner} from 'datocms-react-ui';
import { RenderPageCtx } from 'datocms-plugin-sdk';

type Status = {id:number, status:string, type:string, data?:object};
type PropTypes = { ctx: RenderPageCtx, label: string, status?: string, loading: boolean, error?: Error };

export default function GeneratePdfButton({ ctx, label, status, loading, error }: PropTypes) {

  return (
    <Button>{label}</Button>
  );
}