import { Namespace } from "@pulumi/kubernetes/core/v1";
import ContainerRegistry from "./resources/container-registry";
import ArgoWorkflows from "./resources/argo-workflows";

const namespaceName = "scanweb";
new Namespace(namespaceName, {
  metadata: {
    name: namespaceName,
  },
});

new ContainerRegistry("harbor", {
  namespace: namespaceName,
});

new ArgoWorkflows("argo", {
  namespace: namespaceName,
});
