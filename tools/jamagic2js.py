#!/usr/bin/env python


import sys, os
import re
import shutil


replace_keywords = {
        'Function': 'function',
        'Return'  : 'return',
        'TRUE'    : 'true',
        'FALSE'   : 'false',
        'If'      : 'if',
        'Else'    : 'else',
        'For'     : 'for',
        'While'   : 'while',
        'Switch'  : 'switch',
        'Case'    : 'case',
        'Var'     : 'var',
        'New'     : 'new',
        'Default' : 'default',
}

replace_formatting = {
        r'([^=\s])\s*=\s*([^=\s])': r'\1 = \2',
        r'([^=\s])\s*==\s*([^=\s])': r'\1 == \2',
        r'\)\s*\{'    : ') {',
        r'if\s*\('    : 'if (',
        r'for\s*\('   : 'for (',
        r'while\s*\(' : 'while (',
        r'else\s*\('  : 'else (',
        r'case\s*\('  : 'case (',
}


def make_replacements(data):
    for replacements in [replace_keywords, replace_formatting]:
        for find, replace in replacements.items():
            data = re.sub(find, replace, data, flags=re.MULTILINE)
    return data


def replace(fname, data):
    backup = fname + '.bak'
    shutil.move(fname, backup)
    with open(fname, 'w') as f:
        f.write(data)


def main():
    files = sys.argv[1:]
    for file in files:
        with open(file) as f:
            data = f.read()
        new_data = make_replacements(data)
        replace(file, new_data)


main()

