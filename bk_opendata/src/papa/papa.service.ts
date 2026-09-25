import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class PapaService {
  private readonly logger = new Logger(PapaService.name);

  async getCronograma(department?: string) {
    try {
      const candidates = [
        path.join(process.cwd(), 'db', 'cronograma_papa_leonxiv.json'),
        path.join(__dirname, '..', '..', 'db', 'cronograma_papa_leonxiv.json'),
        path.join(__dirname, '..', 'db', 'cronograma_papa_leonxiv.json'),
      ];

      let rawData: string | null = null;
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          rawData = fs.readFileSync(filePath, 'utf-8');
          break;
        }
      }

      if (!rawData) {
        throw new HttpException(
          'Archivo de cronograma papal no encontrado en el servidor.',
          HttpStatus.NOT_FOUND,
        );
      }

      const data = JSON.parse(rawData);

      if (department && department.trim()) {
        const deptFilter = normalizeText(department);
        const filteredDepts = data.por_departamento.filter(
          (d: any) =>
            normalizeText(d.departamento) === deptFilter ||
            normalizeText(d.slug) === deptFilter,
        );

        return {
          ...data,
          por_departamento: filteredDepts,
          total_departamentos: filteredDepts.length,
        };
      }

      return data;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Error leyendo cronograma papal: ${err.message}`);
      throw new HttpException(
        'Error al procesar el cronograma de la visita apostólica',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
