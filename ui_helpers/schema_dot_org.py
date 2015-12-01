import os
import json

TYPE_HIERARCHY_FILE = os.path.join(os.path.dirname(__file__),
        'schema_dot_org_type_hierarchy.json')

with open(TYPE_HIERARCHY_FILE) as fd:
    type_superclass = json.load(fd)

def is_superclass(first, second):
    while second in type_superclass: # While non-root
        if first == second:
            return True
        second = type_superclass[second]
    return False
