import { RenderPageCtx } from 'datocms-plugin-sdk';
import { Canvas, Button, Spinner, Section } from 'datocms-react-ui';
import styles from './UtilitiesPage.module.css'

type PropTypes = { ctx: RenderPageCtx };

export default function UtilitiesPage({ ctx }: PropTypes) {
  const parameters = ctx.plugin.attributes.parameters as Object;
  
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