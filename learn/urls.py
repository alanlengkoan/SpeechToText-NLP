from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('idtobu', views.idtobu, name='idtobu'),
    path('butoid', views.butoid, name='butoid'),

    path('detect', views.detect, name='detect'),
]
