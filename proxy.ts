import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validarTokenSessao, ADMIN_COOKIE_NAME } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apenas intercepta rotas /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const sessao = validarTokenSessao(token);

  const isLoginPage = pathname === "/admin/login";

  // Se o usuário está na página de login e já possui sessão válida, redireciona para o painel
  if (isLoginPage) {
    if (sessao) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // Para qualquer outra rota sob /admin (como /admin em si), exige login
  if (!sessao) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
