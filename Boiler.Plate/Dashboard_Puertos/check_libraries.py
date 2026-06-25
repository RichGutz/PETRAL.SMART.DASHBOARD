try:
    import shapefile
    print("pyshp available")
except ImportError:
    print("pyshp NOT available")

try:
    import geopandas
    print("geopandas available")
except ImportError:
    print("geopandas NOT available")
