export class MatchExpressionsDto {
  key: string;
  operator: string;
  values: string[];
}
export class NodeSelectorTermsDto {
  matchExpressions: MatchExpressionsDto[];
}

export class RequiredDuringSchedulingIgnoredDuringExecutionDto {
  nodeSelectorTerms: NodeSelectorTermsDto[];
}

export class NodeAffinityDto {
  requiredDuringSchedulingIgnoredDuringExecution: RequiredDuringSchedulingIgnoredDuringExecutionDto;
}

export class AffinityDto {
  nodeAffinity: NodeAffinityDto;
}

export class ContainerDto {
  image: string;
}

export class SpecDto {
  containers: ContainerDto[];
  affinity: AffinityDto;
}
export class ObjectDto {
  spec: SpecDto;
}

export class RequestDto {
  object: ObjectDto;
  uid: string;
}

export class AdmissionDto {
  request: RequestDto;
}

export class ResponseDto {
  uid: string;
  allowed: boolean;
  patchType?: string;
  patch?: string;
}

export class AdmissionResponseDto {
  apiVersion: string;
  kind: string;
  response: ResponseDto;

  constructor(uid: string, patch: string = undefined) {
    const result: AdmissionResponseDto = {
      apiVersion: 'admission.k8s.io/v1',
      kind: 'AdmissionReview',
      response: {
        uid,
        allowed: true,
      },
    };
    if (patch) {
      result.response.patchType = 'JSONPatch';
      result.response.patch = patch;
    }
    return result;
  }
}
