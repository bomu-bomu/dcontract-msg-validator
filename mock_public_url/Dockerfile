# Builder image
FROM golang:1.18.3-alpine3.16 as builder

# Set necessary environmet variables needed for our image
ENV GO111MODULE=on \
  CGO_ENABLED=0 \
  GOOS=linux \
  GOARCH=amd64


# Move to working directory /build
WORKDIR /build

# Copy and download dependency using go mod. 
# We do this before copy the code because docker build will cache dependency.
RUN apk update
RUN apk add git
RUN git clone https://github.com/tkc/go-json-server
# Build the application
RUN cd go-json-server && go build


FROM alpine:3.16

WORKDIR /dist

# set timezone
ENV TZ Asia/Bangkok
ENV PORT=3010
ENV USER=operator
ENV GROUP=nogroup

COPY --from=builder /build/go-json-server/go-json-server /dist/go-json-server
COPY ./api.json /dist/
COPY ./files /dist/

# # Export necessary port
EXPOSE ${PORT}

# # Command to run when starting the container
CMD ["/dist/go-json-server"]
