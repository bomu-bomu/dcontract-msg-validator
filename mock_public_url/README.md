# Public File Mock Service

You can create Public File Mock service with this Dockerfile.
We use go-json-server to mock behavior

### Build image

```
docker build -t public-file-mock:latest .
```

### Run image

```
docker run --rm -p 3010:3010 -d public-file-mock:latest
```
