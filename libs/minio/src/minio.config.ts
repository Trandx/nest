import { Client, ClientOptions } from "minio";
import http  from 'node:http';
import https  from 'node:https';

export class MinioConfig {

  constructor (  readonly config: ClientOptions) {
    if (!config.transportAgent) {
      config.transportAgent = config.useSSL ? this.httpsAgent() : this.httpAgent()
    }
    // Initialize the MinIO client
    this.minioClient = new Client( this.config );
  }

  private minioClient: Client | null;

  private agentOptions: http.AgentOptions = {
    keepAlive: true, // Reuse connections
    maxSockets: 10,  // Maximum simultaneous connections
    keepAliveMsecs: 2000, // Keep connections alive for 2 seconds
  }

  // Configure the HTTPS agent for connection pooling
  public httpAgent = () => new http.Agent(this.agentOptions);

  public httpsAgent = () => new https.Agent(this.agentOptions);

  // Expose the MinIO client
  connect() {
    if (!this.minioClient) throw new Error('connection error')
    return this.minioClient;
  }

  // Expose the MinIO client
  close() {
    this.minioClient = null
    return this.minioClient;
  }
}