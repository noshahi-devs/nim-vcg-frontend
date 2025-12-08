// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Injectable } from '@angular/core';
// import { Examtype } from '../Models/examtype';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class ExamtypeService {
//   getAllExamTypes: any;
//   createExamType // import { Examtype } from '../Models/examtype';
//     (arg0: { examTypeName: any; }) {
//       throw new Error('Method not implemented.');
//   }
//   getExamTypes() {
//     throw new Error('Method not implemented.');
//   }

//   constructor(private http: HttpClient) { }
//   httpOptions = {
//     headers: new HttpHeaders({
//       'Content-Type': 'application/json',

//     })
//   }

//   httpFormOptions = {
//     headers: new HttpHeaders({
//       'Content-Type': 'multipart/form-data',

//     })
//   }


//   apiUrl: string = "https://localhost:7225/api/ExamTypes";


//   public GetdbsExamType(): Observable<Examtype[]> {

//     return this.http.get<Examtype[]>(this.apiUrl);
//   }
//   public GetExamType(id: number): Observable<Examtype> {

//     return this.http.get<Examtype>(this.apiUrl + '/' + id);
//   }
//   public SaveExamType(examType: Examtype): Observable<Examtype> {

//     return this.http.post<Examtype>(this.apiUrl, JSON.stringify(examType), this.httpOptions);
//   }
//   public UpdateExamType(examType: Examtype): Observable<Examtype> {

//     return this.http.put<Examtype>(this.apiUrl + '/' + examType.examTypeId, JSON.stringify(examType), this.httpOptions);
//   }
//   public DeleteExamType(id: number): Observable<Examtype> {

//     return this.http.delete<Examtype>(this.apiUrl + '/' + id);
//   }
// }






import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Examtype } from '../Models/examtype';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExamtypeService {

  constructor(private http: HttpClient) {}

  apiUrl: string = 'https://localhost:7225/api/ExamTypes';

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // ✔ Get All Exam Types
  public GetdbsExamType(): Observable<Examtype[]> {
    return this.http.get<Examtype[]>(this.apiUrl);
  }

  // ✔ Get Single Exam Type by ID
  public GetExamType(id: number): Observable<Examtype> {
    return this.http.get<Examtype>(`${this.apiUrl}/${id}`);
  }

  // ✔ Create Exam Type
  public SaveExamType(examType: Examtype): Observable<Examtype> {
    return this.http.post<Examtype>(this.apiUrl, examType, this.httpOptions);
  }

  // ✔ Update Exam Type
  public UpdateExamType(examType: Examtype): Observable<Examtype> {
    return this.http.put<Examtype>(
      `${this.apiUrl}/${examType.examTypeId}`,
      examType,
      this.httpOptions
    );
  }

  // ✔ Delete Exam Type
  public DeleteExamType(id: number): Observable<Examtype> {
    return this.http.delete<Examtype>(`${this.apiUrl}/${id}`);
  }

}
