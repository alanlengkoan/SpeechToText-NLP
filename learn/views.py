from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def index(request):
    return render(request, 'index.html')

def idtobu(request):
    return render(request, 'idtobu.html')

def butoid(request):
    return render(request, 'butoid.html')

@csrf_exempt
def detect(request):
    data = {
        "fulfillmentText": "Hello, this is a JSON response!",
        "status": "success"
    }
    return JsonResponse(data)