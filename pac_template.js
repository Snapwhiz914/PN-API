function FindProxyForURL(url, host) {
    if (isPlainHostName(host) || dnsDomainIs(host, ".local")) return "DIRECT;"

    /* Don't proxy Windows Update */
    if ((host == "download.microsoft.com") ||
        (host == "ntservicepack.microsoft.com") ||
        (host == "cdm.microsoft.com") ||
        (host == "wustat.windows.com") ||
        (host == "windowsupdate.microsoft.com") ||
        (dnsDomainIs(host, ".windowsupdate.microsoft.com")) ||
        (host == "update.microsoft.com") ||
        (dnsDomainIs(host, ".update.microsoft.com")) ||
        (dnsDomainIs(host, ".windowsupdate.com"))) {
        return 'DIRECT';
    }

    /* Don't proxy local ip addresses */
    if (isInNet(hostIP, '0.0.0.0', '255.0.0.0') ||
        isInNet(hostIP, '10.0.0.0', '255.0.0.0') ||
        isInNet(hostIP, '127.0.0.0', '255.0.0.0') ||
        isInNet(hostIP, '169.254.0.0', '255.255.0.0') ||
        isInNet(hostIP, '172.16.0.0', '255.240.0.0') ||
        isInNet(hostIP, '192.0.2.0', '255.255.255.0') ||
        isInNet(hostIP, '192.88.99.0', '255.255.255.0') ||
        isInNet(hostIP, '192.168.0.0', '255.255.0.0') ||
        isInNet(hostIP, '198.18.0.0', '255.254.0.0') ||
        isInNet(hostIP, '224.0.0.0', '240.0.0.0') ||
        isInNet(hostIP, '240.0.0.0', '240.0.0.0')) {
        return 'DIRECT';
    }

    return "$p_addr DIRECT";
}