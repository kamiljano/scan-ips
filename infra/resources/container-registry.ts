import { ComponentResource } from "@pulumi/pulumi";
import { Deployment } from "@pulumi/kubernetes/apps/v1";
import { Service } from "@pulumi/kubernetes/core/v1";
import * as pulumi from "@pulumi/pulumi";
import * as path from "node:path";
import * as docker from "@pulumi/docker";

interface ContainerRegistryProps {
  namespace: string;
}

export default class ContainerRegistry extends ComponentResource {
  constructor(name: string, props: ContainerRegistryProps) {
    super("custom:resource:ContainerRegistry", name);

    const config = new pulumi.Config();
    const isMinikube = config.requireBoolean("isMinikube");

    const appLabels = { app: name };
    const deployment = new Deployment("harbor", {
      metadata: {
        namespace: props.namespace,
      },
      spec: {
        selector: { matchLabels: appLabels },
        replicas: 1,
        template: {
          metadata: { labels: appLabels },
          spec: {
            containers: [
              {
                name: "harbor-registry",
                image: "bitnami/harbor-registry:latest",
              },
            ],
          },
        },
      },
    });

    const service = new Service(name, {
      metadata: {
        labels: deployment.spec.template.metadata.labels,
        namespace: props.namespace,
      },
      spec: {
        type: isMinikube ? "ClusterIP" : "LoadBalancer",
        ports: [{ port: 80, targetPort: 80, protocol: "TCP" }],
        selector: appLabels,
      },
    });

    const ip = isMinikube
      ? service.spec.clusterIP
      : service.status.loadBalancer.apply(
          (lb) => lb.ingress[0].ip || lb.ingress[0].hostname,
        );

    new docker.Image("scan-web-image", {
      build: {
        context: path.join(__dirname, "..", ".."),
      },
      imageName: "scan-web-image:latest",
      skipPush: true,
      registry: {
        server: ip,
      },
    });
  }
}
