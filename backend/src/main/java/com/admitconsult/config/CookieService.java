package com.admitconsult.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class CookieService {

    public static final String REFRESH_COOKIE = "admit_refresh";

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${app.cookie.same-site:Strict}")
    private String cookieSameSite;

    public void writeRefreshCookie(HttpServletResponse response, String token, String maxAgeSeconds) {
        boolean first = true;
        StringBuilder sb = new StringBuilder();
        sb.append(REFRESH_COOKIE).append("=").append(token).append("; ");
        sb.append("Path=/api/auth; ");
        sb.append("Max-Age=").append(maxAgeSeconds).append("; ");
        sb.append("HttpOnly; ");
        sb.append("SameSite=").append(cookieSameSite);
        if (cookieSecure) sb.append("; Secure");
        response.addHeader("Set-Cookie", sb.toString());
    }

    public void clearRefreshCookie(HttpServletResponse response) {
        StringBuilder sb = new StringBuilder();
        sb.append(REFRESH_COOKIE).append("=; ");
        sb.append("Path=/api/auth; ");
        sb.append("Max-Age=0; ");
        sb.append("HttpOnly; ");
        sb.append("SameSite=").append(cookieSameSite);
        if (cookieSecure) sb.append("; Secure");
        response.addHeader("Set-Cookie", sb.toString());
    }

    public String readRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
