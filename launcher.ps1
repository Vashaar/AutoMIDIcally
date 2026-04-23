Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$npmPath = $null
foreach ($candidate in @(
    "C:\Program Files\nodejs\npm.cmd",
    "$env:ProgramFiles\nodejs\npm.cmd",
    "$env:APPDATA\npm\npm.cmd"
)) {
    if (Test-Path $candidate) { $npmPath = $candidate; break }
}
if (!$npmPath) { $npmPath = "npm.cmd" }

$releaseExe = Join-Path $projectDir "release\win-unpacked\AutoMIDIcally.exe"
$logoPath = Join-Path $projectDir "public\logo-v2.png"

$xaml = @'
<Window
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AutoMIDIcally" Height="360" Width="340"
    WindowStartupLocation="CenterScreen"
    ResizeMode="NoResize"
    Background="Transparent"
    WindowStyle="None"
    AllowsTransparency="True">
  <Border CornerRadius="18" BorderBrush="#18d7d4" BorderThickness="1.2">
    <Border.Background>
      <LinearGradientBrush StartPoint="0,0" EndPoint="1,1">
        <GradientStop Color="#090A10" Offset="0"/>
        <GradientStop Color="#170A36" Offset="0.55"/>
        <GradientStop Color="#061E2A" Offset="1"/>
      </LinearGradientBrush>
    </Border.Background>
    <Grid>
      <Button Name="BtnClose" Content="X" Width="30" Height="30"
              HorizontalAlignment="Right" VerticalAlignment="Top" Margin="0,10,12,0"
              Foreground="#A7F7F5" FontSize="11" FontWeight="Bold" Background="Transparent" BorderThickness="0" Cursor="Hand"/>

      <StackPanel Margin="28,24,28,28" VerticalAlignment="Top">
        <Image Name="AppLogo" Height="104" Width="104" HorizontalAlignment="Center"
               RenderOptions.BitmapScalingMode="HighQuality"/>
        <TextBlock Text="AutoMIDIcally" FontFamily="Segoe UI" FontSize="24" FontWeight="Bold"
                   Foreground="White" HorizontalAlignment="Center" Margin="0,12,0,2"/>
        <TextBlock Text="Local MIDI Pattern Studio" FontFamily="Segoe UI" FontSize="12"
                   Foreground="#78EDEB" HorizontalAlignment="Center" Margin="0,0,0,22"/>

        <Border Background="#100B22" CornerRadius="18" Padding="14,8"
                HorizontalAlignment="Center" Margin="0,0,0,18" BorderBrush="#2BFFFF" BorderThickness="0.4">
          <StackPanel Orientation="Horizontal">
            <Ellipse Name="StatusDot" Width="8" Height="8" Fill="#18D7D4" Margin="0,0,8,0"/>
            <TextBlock Name="StatusText" Text="Ready for desktop launch" FontFamily="Segoe UI"
                       FontSize="12" Foreground="#DFFBFF"/>
          </StackPanel>
        </Border>

        <Button Name="BtnLaunch" Height="46" Cursor="Hand" Margin="0,0,0,10"
                Background="#18D7D4" Foreground="#071019" BorderThickness="0"
                FontFamily="Segoe UI" FontSize="14" FontWeight="Bold" Content="Launch Desktop App"/>

        <TextBlock Text="No browser window. No localhost tab." FontFamily="Segoe UI" FontSize="11"
                   Foreground="#8C8BA3" HorizontalAlignment="Center"/>
      </StackPanel>
    </Grid>
  </Border>
</Window>
'@

$reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xaml))
$window = [Windows.Markup.XamlReader]::Load($reader)

$btnLaunch = $window.FindName("BtnLaunch")
$btnClose = $window.FindName("BtnClose")
$statusDot = $window.FindName("StatusDot")
$statusText = $window.FindName("StatusText")
$appLogo = $window.FindName("AppLogo")

if (Test-Path $logoPath) {
    $bmp = New-Object System.Windows.Media.Imaging.BitmapImage
    $bmp.BeginInit()
    $bmp.UriSource = [Uri]::new($logoPath)
    $bmp.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    $bmp.EndInit()
    $appLogo.Source = $bmp
}

$window.Add_MouseLeftButtonDown({ $window.DragMove() })

$btnLaunch.Add_Click({
    $btnLaunch.IsEnabled = $false
    $statusDot.Fill = [System.Windows.Media.BrushConverter]::new().ConvertFromString("#A855F7")
    $statusText.Text = "Starting AutoMIDIcally..."

    if (Test-Path $releaseExe) {
        Start-Process -FilePath $releaseExe -WorkingDirectory (Split-Path -Parent $releaseExe)
        $window.Close()
        return
    }

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $npmPath
    $psi.Arguments = "run app"
    $psi.WorkingDirectory = $projectDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    try {
        [System.Diagnostics.Process]::Start($psi) | Out-Null
        $window.Close()
    } catch {
        $statusDot.Fill = [System.Windows.Media.Brushes]::OrangeRed
        $statusText.Text = "Launch failed. Run npm run app."
        $btnLaunch.IsEnabled = $true
    }
})

$btnClose.Add_Click({ $window.Close() })

$window.ShowDialog() | Out-Null
