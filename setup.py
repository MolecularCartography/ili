#!/usr/bin/env python
# ----------------------------------------------------------------------------
# Copyright (c) 2013--, Ili development team.
#
# Distributed under the terms of Apache License, Version 2.0.
#
# The full license is in the file LICENSE.md, distributed with this software.
# ----------------------------------------------------------------------------

from distutils.core import setup
from glob import glob

__version__ = "0.2"
__maintainer__ = "`ili development team"
__email__ = "iprotsyuk@gmail.com"

classes = """
"""

classifiers = [s.strip() for s in classes.split('\n') if s]

long_description = """`ili is a toolbox for 2D and 3D molecular mapping in Chrome
"""

base = {"numpy >= 1.7", "qcli", "scikit-bio >= 0.2.1, < 0.3.0"}
doc = {"Sphinx >= 1.2.2", "sphinx-bootstrap-theme"}
test = {"nose >= 0.10.1", "pep8", "flake8"}
all_deps = base | doc | test

setup(
    name='ili',
    version=__version__,
    description='`ili',
    author="",
    author_email=__email__,
    maintainer=__maintainer__,
    maintainer_email=__email__,
    url='https://github.com/ili-toolbox/ili',
    packages=['ili'],
    scripts=glob('scripts/*py'),
    package_data={
        'ili': ['js/*.js', 'js/lib/*.js', 'js/workers/*.js']},
    data_files={},
    install_requires=base,
    extras_require={'doc': doc, 'test': test, 'all': all_deps},
    long_description=long_description,
    classifiers=classifiers)
