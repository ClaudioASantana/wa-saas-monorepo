o retorno no descktop:

[10:19:50.625] Log Level: 2

[10:19:50.645] SSH Resolver called for "ssh-remote+otgnb", attempt 1

[10:19:50.661] remote.SSH.useLocalServer = false

[10:19:50.662] remote.SSH.useExecServer = true

[10:19:50.663] remote.SSH.bindHost = {}

[10:19:50.664] remote.SSH.showLoginTerminal = false

[10:19:50.665] remote.SSH.remotePlatform = {"Ubuntu":"linux","Ubuntu-pessoal":"linux","Infra":"linux","Ubuntu-trabalho":"linux","OTGNB":"windows"}

[10:19:50.666] remote.SSH.path =

[10:19:50.666] remote.SSH.configFile =

[10:19:50.667] remote.SSH.useFlock = true

[10:19:50.668] remote.SSH.lockfilesInTmp = false

[10:19:50.668] remote.SSH.localServerDownload = auto

[10:19:50.669] remote.SSH.remoteServerListenOnSocket = false

[10:19:50.670] remote.SSH.defaultExtensions = []

[10:19:50.670] remote.SSH.defaultExtensionsIfInstalledLocally = []

[10:19:50.671] remote.SSH.loglevel = 2

[10:19:50.671] remote.SSH.enableDynamicForwarding = true

[10:19:50.672] remote.SSH.enableRemoteCommand = false

[10:19:50.673] remote.SSH.serverPickPortsFromRange = {}

[10:19:50.674] remote.SSH.serverInstallPath = {}

[10:19:50.674] remote.SSH.permitPtyAllocation = false

[10:19:50.675] remote.SSH.preferredLocalPortRange = undefined

[10:19:50.676] remote.SSH.useCurlAndWgetConfigurationFiles = false

[10:19:50.677] remote.SSH.experimental.chat = true

[10:19:50.677] remote.SSH.experimental.enhancedSessionLogs = true

[10:19:50.678] remote.SSH.httpProxy = {"\*":""}

[10:19:50.679] remote.SSH.httpsProxy = {"\*":""}

[10:19:50.700] VS Code version: 1.132.0

[10:19:50.701] Remote-SSH version: remote-ssh@0.124.0

[10:19:50.702] win32 x64

[10:19:50.708] SSH Resolver called for host: otgnb

[10:19:50.708] Setting up SSH remote "otgnb"

[10:19:50.724] Using commit id "df53daabb18cd157bdb08c7f01c34df936cf12f4" and quality "stable" for server

[10:19:50.724] Extensions to install:

[10:19:50.763] Install and start server if needed

[10:19:52.405] Checking ssh with "C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common\ssh.exe -V"

[10:19:52.407] Got error from ssh: spawn C:\Program Files (x86)\NVIDIA Corporation\PhysX\Common\ssh.exe ENOENT

[10:19:52.408] Checking ssh with "C:\WINDOWS\system32\ssh.exe -V"

[10:19:52.409] Got error from ssh: spawn C:\WINDOWS\system32\ssh.exe ENOENT

[10:19:52.410] Checking ssh with "C:\WINDOWS\ssh.exe -V"

[10:19:52.411] Got error from ssh: spawn C:\WINDOWS\ssh.exe ENOENT

[10:19:52.412] Checking ssh with "C:\WINDOWS\System32\Wbem\ssh.exe -V"

[10:19:52.414] Got error from ssh: spawn C:\WINDOWS\System32\Wbem\ssh.exe ENOENT

[10:19:52.415] Checking ssh with "C:\WINDOWS\System32\WindowsPowerShell\v1.0\ssh.exe -V"

[10:19:52.416] Got error from ssh: spawn C:\WINDOWS\System32\WindowsPowerShell\v1.0\ssh.exe ENOENT

[10:19:52.417] Checking ssh with "C:\WINDOWS\System32\OpenSSH\ssh.exe -V"

[10:19:52.460] > OpenSSH_for_Windows_9.5p2, LibreSSL 3.8.2

[10:19:52.467] Running script with connection command: "C:\WINDOWS\System32\OpenSSH\ssh.exe" -T -D 62571 otgnb sh

[10:19:52.469] Generated SSH command: 'type "C:\Users\claud\AppData\Local\Temp\vscode-linux-multi-line-command-otgnb-116469271.sh" | "C:\WINDOWS\System32\OpenSSH\ssh.exe" -T -D 62571 otgnb sh'

[10:19:52.471] Using connect timeout of 17 seconds

[10:19:52.473] Terminal shell path: C:\WINDOWS\System32\cmd.exe

[10:19:52.995] >

[10:19:52.997] Got some output, clearing connection timeout

[10:19:53.002] >

[10:19:53.010] >

[10:19:53.462] > Connection reset by 192.168.1.8 port 2222

> O processo tentou gravar em um pipe inexistente.

[10:19:53.780] "install" terminal command done

[10:19:53.781] Install terminal quit with output: O processo tentou gravar em um pipe inexistente.

[10:19:53.782] Received install output: O processo tentou gravar em um pipe inexistente.

[10:19:53.783] WARN: $PLATFORM is undefined in installation script output.  Errors may be dropped.

[10:19:53.785] Failed to parse remote port from server output

[10:19:53.785] Resolver error: Error

    at y.Create (c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:722235)

    at t.handleInstallOutput (c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:720316)

    at t.tryInstall (c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:842913)

    at async c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:801927

    at async t.withShowDetailsEvent (c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:805164)

    at async A (c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:798392)

    at async t.resolve (c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:802578)

    at async c:\Users\claud\.vscode\extensions\ms-vscode-remote.remote-ssh-0.124.0\out\extension.js:2:1095642

[10:19:53.791] ------

[10:19:53.793] No hints found in the recent session.

[10:19:55.561] Opening exec server for ssh-remote+otgnb

[10:19:55.613] Initizing new exec server for ssh-remote+otgnb

[10:19:55.621] Using commit id "df53daabb18cd157bdb08c7f01c34df936cf12f4" and quality "stable" for server

[10:19:55.622] Extensions to install:

[10:19:55.697] Opening exec server for ssh-remote+otgnb

[10:19:55.704] Install and start server if needed

[10:19:57.608] getPlatformForHost was canceled

[10:19:57.609] Exec server for ssh-remote+otgnb failed: Error: Connecting was canceled

[10:19:57.611] Existing exec server for ssh-remote+otgnb errored (Error: Connecting was canceled)

[10:19:57.612] Initizing new exec server for ssh-remote+otgnb

[10:19:57.616] Error opening exec server for ssh-remote+otgnb: Error: Connecting was canceled

[10:19:57.618] No hints found in the recent session.

[10:19:57.620] Using commit id "df53daabb18cd157bdb08c7f01c34df936cf12f4" and quality "stable" for server

[10:19:57.622] Extensions to install:

[10:19:57.640] Install and start server if needed

[10:19:58.446] Running script with connection command: "C:\WINDOWS\System32\OpenSSH\ssh.exe" -T -D 62571 otgnb sh

[10:19:58.448] Generated SSH command: 'type "C:\Users\claud\AppData\Local\Temp\vscode-linux-multi-line-command-otgnb-60638873.sh" | "C:\WINDOWS\System32\OpenSSH\ssh.exe" -T -D 62571 otgnb sh'

[10:19:58.449] Using connect timeout of 17 seconds

[10:19:58.451] Terminal shell path: C:\WINDOWS\System32\cmd.exe

[10:19:58.644] >

[10:19:58.645] Got some output, clearing connection timeout

[10:19:58.654] >

[10:19:58.845] > Connection reset by 192.168.1.8 port 2222

> O processo tentou gravar em um pipe inexistente.

[10:19:59.168] "install" terminal command done

[10:19:59.170] Install terminal quit with output: O processo tentou gravar em um pipe inexistente.

[10:19:59.171] Received install output: O processo tentou gravar em um pipe inexistente.

[10:19:59.173] WARN: $PLATFORM is undefined in installation script output.  Errors may be dropped.

[10:19:59.174] Failed to parse remote port from server output

[10:19:59.175] Exec server for ssh-remote+otgnb failed: Error

[10:19:59.176] Error opening exec server for ssh-remote+otgnb: Error

[10:19:59.177] No hints found in the recent session.

[10:44:29.006] Picking SSH host

[10:44:49.439] Selected mcmoriam@OTGNB

[10:46:09.994] Picking SSH host

[10:46:11.041] Selected otgnb
