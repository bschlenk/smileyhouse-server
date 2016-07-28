#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import sys
from collections import OrderedDict
from ConfigParser import (ConfigParser, MissingSectionHeaderError,
                          ParsingError, DEFAULTSECT)


def lowerFirst(string):
    return string[0].lower() + string[1:]

def convertDict(items):
    section = OrderedDict()
    for name, value in items:
        name = lowerFirst(name)
        if value == '0':
            section[name] = False
        elif value == '1':
            section[name] = True
        else:
            section[name] = [x.strip() for x in value.split() if x]
            if len(section[name]) == 1:
                section[name] = section[name][0]
            elif len(section[name]) == 0:
                section[name] = None
    return section


def convertArray(items):
    items = {k: v for k, v in items}
    section = []
    count = items['#']
    del items['#']
    keys = sorted(map(int, items.keys()))
    for k in keys:
        section.append(items[str(k)])
    return section


def convertSection(items):
    keys = [k for k, v in items]
    if '#' not in keys:
        return convertDict(items)

    keys.remove('#')
    try:
        keys = map(int, keys)
    except ValueError:
        return convertDict(items)
    return convertArray(items)



class StrictConfigParser(ConfigParser):

    def _read(self, fp, fpname):
        cursect = None                        # None, or a dictionary
        optname = None
        lineno = 0
        e = None                              # None, or an exception
        while True:
            line = fp.readline()
            if not line:
                break
            lineno = lineno + 1
            # comment or blank line?
            if line.strip() == '' or line[0] == ';':
                continue
            if line.split(None, 1)[0].lower() == 'rem' and line[0] in "rR":
                # no leading whitespace
                continue
            # continuation line?
            if line[0].isspace() and cursect is not None and optname:
                value = line.strip()
                if value:
                    cursect[optname].append(value)
            # a section header or option header?
            else:
                # is it a section header?
                mo = self.SECTCRE.match(line)
                if mo:
                    sectname = mo.group('header')
                    if sectname in self._sections:
                        raise ValueError('Duplicate section %r' % sectname)
                    elif sectname == DEFAULTSECT:
                        cursect = self._defaults
                    else:
                        cursect = self._dict()
                        cursect['__name__'] = sectname
                        self._sections[sectname] = cursect
                    # So sections can't start with a continuation line
                    optname = None
                # no section header in the file?
                elif cursect is None:
                    raise MissingSectionHeaderError(fpname, lineno, line)
                # an option line?
                else:
                    try:
                        mo = self._optcre.match(line)   # 2.7
                    except AttributeError:
                        mo = self.OPTCRE.match(line)    # 2.6
                    if mo:
                        optname, vi, optval = mo.group('option', 'vi', 'value')
                        #optname = self.optionxform(optname.rstrip())
                        optname = optname.rstrip()
                        # This check is fine because the OPTCRE cannot
                        # match if it would set optval to None
                        if optval is not None:
                            if vi in ('=', ':') and ';' in optval:
                                # ';' is a comment delimiter only if it follows
                                # a spacing character
                                pos = optval.find(';')
                                if pos != -1 and optval[pos - 1].isspace():
                                    optval = optval[:pos]
                            optval = optval.strip()
                            # allow empty values
                            if optval == '""':
                                optval = ''
                            cursect[optname] = [optval]
                        else:
                            # valueless option handling
                            cursect[optname] = optval
                    else:
                        # a non-fatal parsing error occurred.  set up the
                        # exception but keep going. the exception will be
                        # raised at the end of the file and will contain a
                        # list of all bogus lines
                        if not e:
                            e = ParsingError(fpname)
                        e.append(lineno, repr(line))
        # if any parsing errors occurred, raise an exception
        if e:
            raise e

        # join the multi-line values collected while reading
        all_sections = [self._defaults]
        all_sections.extend(self._sections.values())
        for options in all_sections:
            for name, val in options.items():
                if isinstance(val, list):
                    options[name] = '\n'.join(val)

    def dget(self, section, option, default=None, type=str):
        if not self.has_option(section, option):
            return default
        if type is str:
            return self.get(section, option)
        elif type is int:
            return self.getint(section, option)
        elif type is bool:
            return self.getboolean(section, option)
        else:
            raise NotImplementedError()


if __name__ == "__main__":
    cfg = StrictConfigParser()
    if len(sys.argv) > 1:
        f = open(sys.argv[1])
    else:
        f = sys.stdin
    cfg.readfp(f)
    f.close()

    config = OrderedDict()

    for section in cfg.sections():
        sectionKey = lowerFirst(section)
        items = cfg.items(section)
        section = convertSection(items)
        config[sectionKey] = section

    print json.dumps(config, indent=4, separators=(',', ': '))

