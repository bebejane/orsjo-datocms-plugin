import type { Status } from '../types'
import styles from './GeneratePdfButton.module.css'
import { Button, Spinner } from 'datocms-react-ui';
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { GrDocumentPdf } from 'react-icons/gr'

type PropTypes = {
  ctx: RenderPageCtx,
  label: string,
  path: string,
  locale: string,
  status?: Status,
  requestGeneration: (path: string, locale: string) => void
};

export default function GeneratePdfButton({ ctx, status, label, path, locale, requestGeneration }: PropTypes) {

  const downloadFile = (s?: Status) => {

    if (!s?.uploads) return console.log('hej')
    const upload = s?.uploads[0]
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = upload.url;
    document.body.appendChild(link);
    link.click();
    //ctx.notice(`Downloading "${upload.filename}"`);
    setTimeout(() => { link.parentNode?.removeChild(link) }, 0);
  }

  const isGenerating = status?.id && (status && status?.type !== 'END')

  return (
    <div className={styles.wrapper}>
      <Button
        buttonSize="xxs"
        onClick={() => requestGeneration(path, locale)}
        className={styles.generateButton}
      >{`${label}`}</Button>
      <Button
        buttonSize="xxs"
        className={styles.statusIcon}
        disabled={status?.type !== 'END'}
        onClick={() => downloadFile(status)}
        leftIcon={!isGenerating ? <GrDocumentPdf /> : <Spinner />}
      />
    </div>
  );
}