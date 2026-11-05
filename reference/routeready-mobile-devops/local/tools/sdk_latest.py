#!/usr/bin/env python3
"""Print '<zip> <sha1>' for the latest Android command-line tools for a host OS,
read from Google's official SDK repository index (repository2-3.xml)."""
import sys
import xml.etree.ElementTree as ET

index, host = sys.argv[1], sys.argv[2]
root = ET.parse(index).getroot()


def child(el, name):
    return next((c for c in el.iter() if c.tag.split("}")[-1] == name), None)


for pkg in root.iter():
    if pkg.tag.split("}")[-1] == "remotePackage" and pkg.get("path") == "cmdline-tools;latest":
        ch = child(pkg, "channelRef")
        if ch is not None and ch.get("ref") not in (None, "channel-0"):
            continue  # skip beta/dev/canary channels; stable is channel-0
        for arch in pkg.iter():
            if arch.tag.split("}")[-1] != "archive":
                continue
            hos = child(arch, "host-os")
            if hos is not None and hos.text == host:
                print(child(arch, "url").text, child(arch, "checksum").text)
                sys.exit(0)
sys.exit("cmdline-tools for host %s not found in %s" % (host, index))
