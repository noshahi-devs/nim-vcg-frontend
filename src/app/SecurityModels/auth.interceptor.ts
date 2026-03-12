import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  req = rewriteApiUrl(req);

  const jwtToken = getJwtToken();
  const campusId = getSelectedCampusId();

  const headers: any = {};
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  if (campusId) {
    headers['X-Campus-Id'] = campusId;
  }

  if (Object.keys(headers).length > 0) {
    var cloned = req.clone({
      setHeaders: headers,
    });
    return next(cloned);
  }
  return next(req);
};

function getJwtToken(): string | null {
  return localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
}

function getSelectedCampusId(): string | null {
  const savedCampus = localStorage.getItem('selectedCampus');
  if (savedCampus) {
    try {
      const campus = JSON.parse(savedCampus);
      return campus.campusId.toString();
    } catch {
      return null;
    }
  }
  return null;
}

function rewriteApiUrl(req: Parameters<HttpInterceptorFn>[0]) {
  const localUrls = [
    "https://localhost:7225", 
    "https://localhost:7225", 
    "http://127.0.0.1:5257",
    "https://127.0.0.1:7225"
  ];
  const matchedBase = localUrls.find(url => req.url.startsWith(url));
  
  if (!matchedBase) {
    return req;
  }

  const rewrittenUrl = `${environment.apiBaseUrl}${req.url.substring(matchedBase.length)}`;
  return req.clone({ url: rewrittenUrl });
}
