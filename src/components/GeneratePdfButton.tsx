import styles from './GeneratePdfButton.module.css'
import { Button, Spinner} from 'datocms-react-ui';
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { GrDocumentPdf } from 'react-icons/gr'

type Status = {id:number, status:string, type:string, path:string, locale:string, data?:any, item?:number, total?:number, updated?:[], notFound?:[]};
type PropTypes = { ctx: RenderPageCtx, label: string, path:string, locale:string, status?: Status, requestGeneration:(path: string, locale:string) => void};

export default function GeneratePdfButton({ ctx, status, label, path, locale, requestGeneration }: PropTypes) {

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
  
  const isGenerating = status?.id && (status && status?.status !== 'END')
  return (
      <>
        <Button buttonSize="xxs" onClick={() => requestGeneration(path, locale)} className={styles.generateButton}>{`${label}`}</Button>
        &nbsp;
        <Button 
          buttonSize="xxs"
          className={styles.statusIcon}
          disabled={status?.status !== 'END'} 
          onClick={()=>downloadFile(status)} 
          leftIcon={!isGenerating ? <GrDocumentPdf/> : <Spinner/>}
        />
      </>
  );
}