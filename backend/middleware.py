class ApiSlashMiddleware:
    """
    Ensures URL paths have trailing slashes before URL routing so both
    /path and /path/ resolve seamlessly without 301 redirects that drop POST/PUT/PATCH data.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info
        if not path.endswith("/"):
            last_segment = path.split("/")[-1]
            if "." not in last_segment:
                request.path_info = f"{path}/"
        return self.get_response(request)
