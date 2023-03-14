import type { Status } from '../types'
import styles from './GeneratePdfButton.module.css'
import { Button, Spinner } from 'datocms-react-ui';
import { RenderPageCtx } from 'datocms-plugin-sdk';
import { GrDocumentPdf } from 'react-icons/gr'
import cn from 'classnames'

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

    if (!s?.uploads) return console.log('no uploads')
    const upload = s?.uploads[0]
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = upload.url;
    document.body.appendChild(link);
    link.click();
    console.log(`Downloading "${upload.filename}"`)
    link.parentNode?.removeChild(link)
  }

  const isGenerating = status?.id && (status && status?.type !== 'END')
  const href = status?.type === 'END' && status.uploads ? status.uploads[0].href : '#' as string
  return (
    <div className={styles.wrapper}>
      <Button
        buttonSize="xxs"
        onClick={() => requestGeneration(path, locale)}
        className={styles.generateButton}
      >{`${label}`}</Button>
      <a
        className={cn(styles.statusIcon, status?.type !== 'END' && styles.disabled)}
        download
        href={href}
      >{!isGenerating ? <GrDocumentPdf /> : <Spinner />}</a>
    </div>
  );
}