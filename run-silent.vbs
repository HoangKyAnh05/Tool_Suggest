Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "e:\code_tino_19_4\Code_Tool_Python\Tool_Suggest"
WshShell.Run """e:\code_tino_19_4\Code_Tool_Python\Tool_Suggest\node_modules\electron\dist\electron.exe"" .", 0, False
