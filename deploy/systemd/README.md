# systemd (VPS)

These unit files replace the ad-hoc `nohup` runners and keep the pipeline alive across restarts.

## Install (root)

```bash
mkdir -p /etc/fpho
cp /root/Flux-Oracle/deploy/systemd/fpho.env.example /etc/fpho/fpho.env

cp /root/Flux-Oracle/deploy/systemd/fpho-api.service /etc/systemd/system/fpho-api.service
cp /root/Flux-Oracle/deploy/systemd/fpho-ingestor.service /etc/systemd/system/fpho-ingestor.service
cp /root/Flux-Oracle/deploy/systemd/fpho-minute-finalizer.service /etc/systemd/system/fpho-minute-finalizer.service
cp /root/Flux-Oracle/deploy/systemd/fpho-hour-finalizer.service /etc/systemd/system/fpho-hour-finalizer.service

systemctl daemon-reload
systemctl enable --now fpho-api fpho-ingestor fpho-minute-finalizer fpho-hour-finalizer
```

## Logs

```bash
journalctl -u fpho-ingestor -f
journalctl -u fpho-minute-finalizer -f
journalctl -u fpho-hour-finalizer -f
journalctl -u fpho-api -f
```
