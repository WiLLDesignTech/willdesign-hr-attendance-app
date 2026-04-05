import type { Document } from "@hr-attendance-app/types";
import type { DocumentRepository } from "../repositories/document.js";

export interface DocumentServiceDeps {
  readonly documentRepo: DocumentRepository;
}

export class DocumentService {
  private readonly deps: DocumentServiceDeps;

  constructor(deps: DocumentServiceDeps) {
    this.deps = deps;
  }

  async findByEmployee(employeeId: string): Promise<readonly Document[]> {
    return this.deps.documentRepo.findByEmployee(employeeId);
  }

  async getUploadUrl(employeeId: string, fileName: string): Promise<string> {
    return this.deps.documentRepo.getUploadUrl(employeeId, fileName);
  }

  async save(metadata: Document): Promise<Document> {
    return this.deps.documentRepo.save(metadata);
  }
}
