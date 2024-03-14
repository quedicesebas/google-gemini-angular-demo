import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileConversionService {
  constructor(private http: HttpClient) {}
  async convertToBase64(
    filePath: string
  ): Promise<string | ArrayBuffer | null> {
    const blob = await firstValueFrom(
      this.http.get(filePath, { responseType: 'blob' })
    );
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data.substring(base64data.indexOf(',') + 1)); // Extract only the Base64 data
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  }
}
