import { RenderConfigScreenCtx } from 'datocms-plugin-sdk';
import { Canvas, Form, FieldGroup, TextField, Button } from 'datocms-react-ui';
import { useState } from 'react';

type Props = { ctx: RenderConfigScreenCtx; };

type FreshInstallationParameters = { host:'', username:'', password:''};

type ValidParameters = { host: string, username: string, password: string };

type Parameters = FreshInstallationParameters | ValidParameters;

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;
  const [form, setForm] = useState({...parameters})

  const saveSettings = () => {
    ctx.updatePluginParameters({...form})
    ctx.notice('Settings updated successfully!');
  }

  return (
    <Canvas ctx={ctx}>
      <Form>
        <FieldGroup>
          <TextField
            required
            name="host"
            id="host"
            label="Server URL"
            value={form.host}
            placeholder="http://..."
            hint="Provide webserver host"
            onChange={(host) => setForm({...form, host})}
          />
          <TextField
            required
            name="username"
            id="username"
            label="Username"
            value={form.username}
            placeholder="Basic auth username..."
            hint="Provide username"
            onChange={(username) => setForm({...form, username})}
          />
          <TextField
            required
            name="password"
            id="password"
            label="Password"
            value={form.password}
            placeholder="Basic auth password..."
            hint="Provide password"
            onChange={(password) => setForm({...form, password})}
          />
          <Button onClick={saveSettings}>Save settings</Button>
        </FieldGroup>
      </Form>
    </Canvas>
  );
}
