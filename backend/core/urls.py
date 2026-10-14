from django.contrib import admin
from django.urls import path, include, re_path

from .schema import swagger_urlpatterns
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.common.admin_auth import admin_login_view, admin_2fa_verify, admin_2fa_setup

# Admin URL prefiksi .env'dan — masalan 'markaz/', 'boshqaruv/'
ADMIN_URL = settings.ADMIN_URL

urlpatterns = [
    # Custom admin login/2FA — admin.site.urls'dan OLDIN bo'lishi shart
    path(ADMIN_URL + 'login/', admin_login_view, name='admin_login'),
    path(ADMIN_URL + '2fa/verify/', admin_2fa_verify, name='admin_2fa_verify'),
    path(ADMIN_URL + '2fa/setup/', admin_2fa_setup, name='admin_2fa_setup'),
    path(ADMIN_URL, admin.site.urls),

]


urlpatterns += [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

urlpatterns += [
    path('api/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/organizations/', include('apps.organizations.api.api_urls', namespace='organizations')),
    path('api/services/', include('apps.services.api.api_urls', namespace='services')),
    path('api/contracts/', include('apps.contracts.api.api_urls', namespace='contracts')),
    path('api/common/', include('apps.common.urls', namespace='common')),
    path("api/orders/", include('apps.payment.urls', namespace='orders')),
    path('api/books/', include('apps.book_market.api.api_urls', namespace='book-orders')),
    path('api/additional-services/', include('apps.additional_services.urls', namespace='additional_services')),
    path('api/notifications/', include('apps.notifications.urls', namespace='notifications')),
    path('api/analytics/', include('apps.analytics.urls', namespace='analytics')),
    path('api/citizens/', include('apps.citizens.urls', namespace='citizens')),
]


# urlpatterns += swagger_urlpatterns

if settings.DEBUG:
    if settings.MEDIA_FALLBACK_URL:
        # Lokal dev: fayl media/ da bo'lmasa production nusxasiga yo'naltiriladi
        from django.http import HttpResponseRedirect
        from django.views.static import serve

        def media_with_fallback(request, path):
            if (settings.MEDIA_ROOT / path).is_file():
                return serve(request, path, document_root=settings.MEDIA_ROOT)
            return HttpResponseRedirect(settings.MEDIA_FALLBACK_URL.rstrip('/') + '/' + path)

        urlpatterns += [re_path(r'^media/(?P<path>.*)$', media_with_fallback)]
    else:
        urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
import debug_toolbar

urlpatterns += [
    path('__debug__/', include(debug_toolbar.urls)),
]