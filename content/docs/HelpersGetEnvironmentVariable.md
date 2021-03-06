﻿# Get-EnvironmentVariable

Gets an Environment Variable.

## Syntax

~~~powershell
Get-EnvironmentVariable -Name <String> -Scope {Process | User | Machine} [-PreserveVariables] [<CommonParameters>]
~~~

## Description

This will will get an environment variable based on the variable name and scope while accounting whether to expand the variable or not (e.g.: %TEMP% -> C:\User\Username\AppData\Local\Temp).

## Notes

This helper reduces the number of lines one would have to write to get environment variables, mainly when not expanding the variables is a must.

## Aliases

None

## Inputs

None

## Outputs

None

## Parameters

###  -Name \<String\>
The environemnt variable you want to get the value from.

Property               | Value
---------------------- | -----
Aliases                | 
Required?              | true
Position?              | 1
Default Value          | 
Accept Pipeline Input? | false
 
###  -Scope
The environemnt variable target scope.


Valid options: Process, User, Machine

Property               | Value
---------------------- | -----
Aliases                | 
Required?              | true
Position?              | 2
Default Value          | 
Accept Pipeline Input? | false
 
###  -PreserveVariables
A switch parameter stating whether you want to expand the variables or not. Defaults to false. Available in 0.9.10+.

Property               | Value
---------------------- | -----
Aliases                | 
Required?              | false
Position?              | named
Default Value          | False
Accept Pipeline Input? | false
 
### \<CommonParameters\>

This cmdlet supports the common parameters: -Verbose, -Debug, -ErrorAction, -ErrorVariable, -OutBuffer, and -OutVariable. For more information, see `about_CommonParameters` http://go.microsoft.com/fwlink/p/?LinkID=113216 .


## Examples

 **EXAMPLE 1**

~~~powershell
Get-EnvironmentVariable 'TEMP' User -PreserveVariables

~~~

## Links

 * [[Get-EnvironmentVariableNames|HelpersGetEnvironmentVariableNames]]
 * [[Set-EnvironmentVariable|HelpersSetEnvironmentVariable]]


[[Function Reference|HelpersReference]]

***NOTE:*** This documentation has been automatically generated from `Import-Module "$env:ChocolateyInstall\helpers\chocolateyInstaller.psm1" -Force; Get-Help Get-EnvironmentVariable -Full`.
