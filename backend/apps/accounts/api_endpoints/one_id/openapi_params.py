from drf_yasg import openapi

oneID_code_param = openapi.Parameter(
    "code",  # name of the parameter
    in_=openapi.IN_QUERY,  # the location of the parameter
    description="The authorization code received from OneId",  # description of the parameter
    type=openapi.TYPE_STRING,  # the type of the parameter
    required=True,  # whether the parameter is required or not
)
