import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../environments/environment";

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
  return localStorage.getItem('JWT_TOKEN');
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
  const localApiBase = "http://localhost:5257";
  if (!req.url.startsWith(localApiBase)) {
    return req;
  }

  const rewrittenUrl = `${environment.apiBaseUrl}${req.url.substring(localApiBase.length)}`;
  return req.clone({ url: rewrittenUrl });
}
