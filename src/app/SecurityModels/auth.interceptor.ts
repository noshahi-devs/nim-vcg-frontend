import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../environments/environment";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  req = rewriteApiUrl(req);

  const jwtToken = getJwtToken();
  if (jwtToken) {
    var cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    return next(cloned);
  }
  return next(req);
};

function getJwtToken(): string | null {
  return localStorage.getItem('JWT_TOKEN');
}

function rewriteApiUrl(req: Parameters<HttpInterceptorFn>[0]) {
  const localApiBase = "http://localhost:5257";
  if (!req.url.startsWith(localApiBase)) {
    return req;
  }

  const rewrittenUrl = `${environment.apiBaseUrl}${req.url.substring(localApiBase.length)}`;
  return req.clone({ url: rewrittenUrl });
}
