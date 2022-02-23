import { RenderConfigScreenCtx } from 'datocms-plugin-sdk';
import { Canvas, ContextInspector, Form, FieldGroup, TextField, Button } from 'datocms-react-ui';
import s from './styles.module.css';

type Props = { ctx: RenderConfigScreenCtx; };

type FreshInstallationParameters = { host:''};

type ValidParameters = { host: string };

type Parameters = FreshInstallationParameters | ValidParameters;

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;
  const handleSubmit = () => {}

  return (
    <Canvas ctx={ctx}>
      <Form onSubmit={handleSubmit}>
        <FieldGroup>
          <TextField
            required
            name="host"
            id="host"
            label="Server URL"
            value={parameters.host}
            placeholder="http://..."
            hint="Provide webserver host"
            onChange={(newValue) => ctx.updatePluginParameters({ host: newValue })}
          />
        </FieldGroup>
      </Form>
      {/*
      <div className={s.inspector}>
        <ContextInspector />
      </div>
      */}
    </Canvas>
  );
}
