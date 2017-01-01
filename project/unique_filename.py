import itertools
import os
import re
 
def unique_file_name(file):
    ''' Append a counter to the end of file name if 
    such file allready exist.'''
    if not os.path.isfile(file):
        # do nothing if such file doesn exists
        return file 
    # test if file has extension:
    if re.match('.+\.[a-zA-Z0-9]+$', os.path.basename(file)):
        # yes: append counter before file extension.
        name_func = \
            lambda f, i: re.sub('(\.[a-zA-Z0-9]+)$', '_%i\\1' % i, f)
    else:
        # filename has no extension, append counter to the file end
        name_func = \
            lambda f, i: ''.join([f, '_%i' % i])
    for new_file_name in \
            (name_func(file, i) for i in itertools.count(1)):
        if not os.path.exists(new_file_name):
            return new_file_name