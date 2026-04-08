using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.db.Models
{
    [Table("timetable")]
    public class Timetable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int StaffId { get; set; }

        [Column(TypeName = "DATETIME")]
        public DateTime Slot { get; set; }

        [ForeignKey("StaffId")]
        public Staff Staff { get; set; } = null!;
    }
}