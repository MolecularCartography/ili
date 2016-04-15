# ----------------------------------------------------------------------------
# Copyright (c) 2013--, ili development team.
#
# Distributed under the terms of the Modified BSD License.
#
# The full license is in the file LICENSE.md, distributed with this software.
# ----------------------------------------------------------------------------
from __future__ import division

from os.path import abspath, dirname, join

from qcli.util import qcli_system_call

from ili import __version__ as ili_library_version


class iliSupportFilesError(IOError):
    """Exception for missing support files"""
    pass


class iliInputFilesError(IOError):
    """Exception for missing support files"""
    pass


class iliUnsupportedComputation(ValueError):
    """Exception for computations that lack a meaning"""
    pass


def get_ili_project_dir():
    """ Returns the top-level ili directory

    based on qiime.util.get_qiime_project_dir from github.com/qiime/qiime
    """
    # Get the full path of util.py
    current_file_path = abspath(__file__)
    # Get the directory containing util.py
    current_dir_path = dirname(current_file_path)
    # Return the directory containing the directory containing util.py
    return dirname(current_dir_path)
