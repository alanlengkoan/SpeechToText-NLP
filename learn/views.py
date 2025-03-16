from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os

def index(request):
    return render(request, 'index.html')

def idtobu(request):
    return render(request, 'idtobu.html')

def butoid(request):
    media_path = settings.MEDIA_ROOT
    files = os.listdir(media_path) if os.path.exists(media_path) else []
    
    return render(request, 'butoid.html', {"files": files})

@csrf_exempt
def detect(request):
    data = request.POST
    files = request.FILES
    
    # message = data.get('message')
    file = files.get('file')

    save_path = os.path.join(settings.MEDIA_ROOT, file.name)

    with open(save_path, "wb+") as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    print(file.name)

    data = {
        "fulfillmentText": "Hello, this is a JSON response!",
        "status": "success"
    }
    return JsonResponse(data)

def delete_file(request, filename):
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    
    if os.path.exists(file_path):
        os.remove(file_path)
        return redirect("list_files")  # Kembali ke daftar file setelah menghapus
    else:
        return HttpResponse("File tidak ditemukan.", status=404)