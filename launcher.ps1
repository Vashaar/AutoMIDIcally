Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

# Find npm.cmd (must use .cmd, not .ps1, when spawning via cmd.exe)
$npmPath = $null
foreach ($candidate in @(
    "C:\Program Files\nodejs\npm.cmd",
    "$env:ProgramFiles\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd"
)) { if (Test-Path $candidate) { $npmPath = $candidate; break } }
if (!$npmPath) { $npmPath = "npm.cmd" }

$projectDir = "C:\Users\vasha\Downloads\AutoMIDIcally"

$xaml = @'
<Window
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AutoMIDIcally" Height="400" Width="320"
    WindowStartupLocation="CenterScreen"
    ResizeMode="NoResize"
    Background="#0d0d0f"
    WindowStyle="None"
    AllowsTransparency="True">
  <Border Background="#0d0d0f" CornerRadius="16" BorderBrush="#2e2e32" BorderThickness="1">
    <Grid>
      <Button Name="BtnClose" Content="X" Width="28" Height="28"
              HorizontalAlignment="Right" VerticalAlignment="Top" Margin="0,8,10,0"
              Foreground="#6b7280" FontSize="11" FontWeight="Bold" Background="Transparent" BorderThickness="0" Cursor="Hand">
        <Button.Template>
          <ControlTemplate TargetType="Button">
            <Border Name="Bd" Background="Transparent" CornerRadius="6">
              <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
            </Border>
            <ControlTemplate.Triggers>
              <Trigger Property="IsMouseOver" Value="True">
                <Setter TargetName="Bd" Property="Background" Value="#7f1d1d"/>
                <Setter Property="Foreground" Value="White"/>
              </Trigger>
            </ControlTemplate.Triggers>
          </ControlTemplate>
        </Button.Template>
      </Button>

      <StackPanel Margin="28,18,28,24" VerticalAlignment="Top">
        <Image Name="AppLogo" Height="88" Width="88" HorizontalAlignment="Center"
               RenderOptions.BitmapScalingMode="HighQuality" Margin="0,8,0,0"/>
        <TextBlock Text="AutoMIDIcally" FontFamily="Segoe UI" FontSize="21" FontWeight="Bold"
                   Foreground="White" HorizontalAlignment="Center" Margin="0,10,0,2"/>
        <TextBlock Text="AI MIDI Pattern Generator" FontFamily="Segoe UI" FontSize="11"
                   Foreground="#6b7280" HorizontalAlignment="Center" Margin="0,0,0,18"/>

        <Border Name="StatusPill" Background="#1c1c1f" CornerRadius="20" Padding="14,7"
                HorizontalAlignment="Center" Margin="0,0,0,18">
          <StackPanel Orientation="Horizontal">
            <Ellipse Name="StatusDot" Width="8" Height="8" Fill="#3a3a3f" Margin="0,0,8,0"/>
            <TextBlock Name="StatusText" Text="Ready to launch" FontFamily="Segoe UI"
                       FontSize="12" Foreground="#9ca3af"/>
          </StackPanel>
        </Border>

        <Button Name="BtnLaunch" Height="44" Cursor="Hand" Margin="0,0,0,10">
          <Button.Template>
            <ControlTemplate TargetType="Button">
              <Border Name="Bd" Background="#7c3aed" CornerRadius="10">
                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
              </Border>
              <ControlTemplate.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                  <Setter TargetName="Bd" Property="Background" Value="#6d28d9"/>
                </Trigger>
                <Trigger Property="IsPressed" Value="True">
                  <Setter TargetName="Bd" Property="Background" Value="#5b21b6"/>
                </Trigger>
              </ControlTemplate.Triggers>
            </ControlTemplate>
          </Button.Template>
          <TextBlock Name="BtnText" Text="Launch App" Foreground="White"
                     FontFamily="Segoe UI" FontSize="14" FontWeight="SemiBold"/>
        </Button>

        <Button Name="BtnOpen" Height="36" Cursor="Hand" Visibility="Collapsed">
          <Button.Template>
            <ControlTemplate TargetType="Button">
              <Border Name="Bd" Background="#1c1c1f" CornerRadius="10">
                <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
              </Border>
              <ControlTemplate.Triggers>
                <Trigger Property="IsMouseOver" Value="True">
                  <Setter TargetName="Bd" Property="Background" Value="#242427"/>
                </Trigger>
              </ControlTemplate.Triggers>
            </ControlTemplate>
          </Button.Template>
          <TextBlock Text="Open in Browser" Foreground="#9ca3af"
                     FontFamily="Segoe UI" FontSize="12" FontWeight="SemiBold"/>
        </Button>
      </StackPanel>
    </Grid>
  </Border>
</Window>
'@

$reader  = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$window  = [Windows.Markup.XamlReader]::Load($reader)

$btnLaunch  = $window.FindName("BtnLaunch")
$btnText    = $window.FindName("BtnText")
$btnOpen    = $window.FindName("BtnOpen")
$btnClose   = $window.FindName("BtnClose")
$statusDot  = $window.FindName("StatusDot")
$statusText = $window.FindName("StatusText")
$statusPill = $window.FindName("StatusPill")
$appLogo    = $window.FindName("AppLogo")

# Load logo
$logoPath = "$projectDir\public\logo-v2.png"
if (Test-Path $logoPath) {
    $bmp = New-Object System.Windows.Media.Imaging.BitmapImage
    $bmp.BeginInit()
    $bmp.UriSource  = [Uri]::new($logoPath)
    $bmp.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    $bmp.EndInit()
    $appLogo.Source = $bmp
}

$window.Add_MouseLeftButtonDown({ $window.DragMove() })

$script:proc = $null
$script:port = 5173

function Set-Idle {
    $statusDot.Fill  = [System.Windows.Media.Brushes]::DimGray
    $statusText.Text = "Ready to launch"
    $btnText.Text    = "Launch App"
    $btnLaunch.IsEnabled   = $true
    $btnOpen.Visibility    = "Collapsed"
}

function Set-Running($p) {
    $statusDot.Fill  = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#22c55e")
    $statusText.Text = "Running on :$p"
    $btnText.Text    = "Stop Server"
    $btnLaunch.IsEnabled = $true
    $btnOpen.Visibility  = "Visible"
    $script:port = $p
}

Set-Idle

$btnLaunch.Add_Click({
    if ($script:proc -and !$script:proc.HasExited) {
        # Stop
        taskkill /F /T /PID $script:proc.Id 2>$null | Out-Null
        $script:proc = $null
        Set-Idle
    } else {
        # Launch
        $statusDot.Fill  = [System.Windows.Media.Brushes]::Orange
        $statusText.Text = "Starting server..."
        $btnLaunch.IsEnabled = $false

        $psi = New-Object System.Diagnostics.ProcessStartInfo "cmd.exe"
        $psi.Arguments = "/c set PATH=%PATH%;C:\Program Files\nodejs && `"$npmPath`" run dev"
        $psi.WorkingDirectory = $projectDir
        $psi.UseShellExecute  = $false
        $psi.CreateNoWindow   = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError  = $true

        $script:proc = [System.Diagnostics.Process]::Start($psi)

        $timer = New-Object System.Windows.Threading.DispatcherTimer
        $timer.Interval = [TimeSpan]::FromSeconds(1)
        $tries = 0
        $timer.Add_Tick({
            $tries++
            foreach ($p in 5173,5174,5175,5176,5177) {
                try {
                    $t = New-Object System.Net.Sockets.TcpClient
                    $t.Connect("127.0.0.1", $p)
                    $t.Close()
                    $timer.Stop()
                    Set-Running $p
                    Start-Process "http://localhost:$p"
                    return
                } catch {}
            }
            if ($tries -ge 25) { $timer.Stop(); Set-Idle }
        })
        $timer.Start()
    }
})

$btnOpen.Add_Click({ Start-Process "http://localhost:$($script:port)" })

$btnClose.Add_Click({
    if ($script:proc -and !$script:proc.HasExited) {
        taskkill /F /T /PID $script:proc.Id 2>$null | Out-Null
    }
    $window.Close()
})

$window.ShowDialog() | Out-Null
